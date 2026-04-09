'use client';

export function DeveloperResources() {
    return (
        <div className="card">
            <div className="card-body">
                <div className="card-title d-flex justify-content-between border-bottom border-gray-300 pb-2">
                    <div className="me-4">Kickstart your development journey on Nara</div>
                    <div>
                        Find more on{' '}
                        <a href="https://nara.build/docs" target="_blank" rel="noreferrer">
                            nara.build/docs
                        </a>
                    </div>
                </div>
                <div className="d-flex gap-4 pb-3 overflow-auto">
                    <ResourceCard
                        title="Setup Your Nara Environment"
                        description="Get started in 5 minutes or less!"
                        image="/nara-dev-setup.png"
                        link="https://nara.build/docs"
                    />
                    <ResourceCard
                        title="Quick Start Guide"
                        description="Hands-on guide to the core concepts for building on Nara"
                        image="/nara-quickstart.png"
                        link="https://nara.build/docs"
                    />
                    <ResourceCard
                        title="Nara Developer Bootcamp"
                        description="Learn to build aApps on the agent-native Layer 1"
                        image="/nara-bootcamp.png"
                        link="https://nara.build/docs"
                    />
                    <ResourceCard
                        title="Build Your First aApp"
                        description="A guide for developers to build autonomous agent applications"
                        image="/nara-aapp.png"
                        link="https://nara.build/docs"
                    />
                </div>
            </div>
        </div>
    );
}

function ResourceCard({
    title,
    description,
    image,
    link,
    imageBackground,
}: {
    title: string;
    description: string;
    image: string;
    imageBackground?: string;
    link: string;
}) {
    return (
        <div className="flex flex-col" style={{ height: '200px', width: '250px' }}>
            <div className="w-full mb-3">
                <a href={link} target="_blank" rel="noopener noreferrer" className="hover:cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={`${title} preview`}
                        style={{
                            backgroundColor: imageBackground,
                            height: '120px',
                            objectFit: 'cover',
                            width: '250px',
                        }}
                    />
                </a>
            </div>
            <div className="flex flex-col">
                <p className="mb-1">{title}</p>
                <p className="text-muted mb-2 text-wrap line-clamp-3">{description}</p>
            </div>
        </div>
    );
}
